const http = require("http");
const { spawn } = require("child_process");

const hostUrl = "http://127.0.0.1:5051/health";
const isWindows = process.platform === "win32";

function quoteWindowsArgument(argument) {
  if (/^[A-Za-z0-9_./:-]+$/.test(argument)) {
    return argument;
  }

  return `"${argument.replace(/"/g, '\\"')}"`;
}

function spawnCommand(command, args, options = {}) {
  if (isWindows && (command === "npm" || command === "npx")) {
    const commandLine = [command, ...args].map(quoteWindowsArgument).join(" ");

    return spawn("cmd.exe", ["/d", "/s", "/c", commandLine], {
      stdio: "inherit",
      ...options
    });
  }

  return spawn(command, args, {
    stdio: "inherit",
    ...options
  });
}

function pingServer() {
  return new Promise((resolve) => {
    const request = http.get(hostUrl, (response) => {
      response.resume();
      resolve(Boolean(response.statusCode && response.statusCode >= 200 && response.statusCode < 500));
    });

    request.on("error", () => resolve(false));
    request.setTimeout(1000, () => {
      request.destroy();
      resolve(false);
    });
  });
}

async function waitForServer(timeoutMs) {
  const startedAt = Date.now();

  while (Date.now() - startedAt <= timeoutMs) {
    if (await pingServer()) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Timed out waiting for frontend host at ${hostUrl}`);
}

function runProcess(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawnCommand(command, args, options);

    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} exited with code ${code ?? "null"} and signal ${signal ?? "none"}`));
    });
  });
}

function stopServer(serverProcess) {
  if (!serverProcess || serverProcess.killed) {
    return Promise.resolve();
  }

  if (isWindows) {
    return runProcess("taskkill", ["/pid", String(serverProcess.pid), "/t", "/f"])
      .catch(() => undefined);
  }

  serverProcess.kill("SIGINT");
  return Promise.resolve();
}

async function main() {
  const hostAlreadyRunning = await pingServer();
  const serverProcess = hostAlreadyRunning
    ? null
    : spawn(
        "dotnet",
        ["run", "--project", "./KwintBaseHarmony.Frontend.csproj", "--no-launch-profile", "--urls", "http://localhost:5051"],
        {
          stdio: "inherit"
        }
      );

  try {
    if (!hostAlreadyRunning) {
      await waitForServer(30000);
    }

    await runProcess("npm", ["run", "cy:run"]);
  } finally {
    if (!hostAlreadyRunning) {
      await stopServer(serverProcess);
    }
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});