import React from 'react';

export default function Welcome() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Piano Keyboard Visual */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex justify-center gap-1 mb-8">
            {Array.from({ length: 14 }).map((_, i) => (
              <div
                key={i}
                className={`w-8 h-32 rounded-b-lg border-2 border-gray-300 transition-all ${
                  i % 2 === 0 ? 'bg-white' : 'bg-gray-900'
                }`}
              />
            ))}
          </div>
          
          {/* Welcome Text */}
          <h1 className="text-4xl font-bold text-center text-gray-800 mb-2">
            KwintBaseHarmony
          </h1>
          <p className="text-center text-gray-600 text-lg">
            Learn music harmony through composition
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          {/* Start Button */}
          <button className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 px-6 rounded-lg shadow-md transition-all text-lg">
            Start (Beginner)
          </button>

          {/* How to Play Button */}
          <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-4 px-6 rounded-lg shadow-md transition-all text-lg flex items-center justify-center gap-2">
            <span>ⓘ</span> How to Play (Optional)
          </button>

          {/* Level Selection */}
          <div className="pt-4 border-t-2 border-gray-200">
            <p className="text-center text-gray-600 mb-3 font-semibold">Choose Your Level:</p>
            <div className="grid grid-cols-3 gap-2">
              <button className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-2 px-4 rounded-lg transition-all">
                Beginner
              </button>
              <button className="bg-orange-400 hover:bg-orange-500 text-gray-900 font-semibold py-2 px-4 rounded-lg transition-all">
                Intermediate
              </button>
              <button className="bg-red-400 hover:bg-red-500 text-white font-semibold py-2 px-4 rounded-lg transition-all">
                Advanced
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
