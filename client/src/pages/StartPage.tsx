// src/pages/StartPage.tsx
import { useNavigate } from "react-router-dom";

export default function StartPage() {
  const nav = useNavigate();
  return (
    <div className="min-h-screen w-full grid place-items-center bg-gray-900 text-white p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-5xl text-yellow-400" style={{ fontFamily: '"Alex Brush", cursive' }}>
          Ready to start?
        </h1>
        <p className="text-gray-300">
          You’re signed in / visiting as guest. Click continue to enter the table.
        </p>
        <button
          onClick={() => nav("/play")}
          className="w-full p-3 uppercase font-extrabold text-white 
                     bg-gradient-to-b from-purple-400 to-purple-800 
                     border-[3px] border-yellow-900 rounded-md 
                     shadow-[inset_0_2px_4px_rgba(0,0,0,0.6),0_2px_4px_rgba(0,0,0,0.8)] 
                     transition-all duration-300 hover:from-green-400 hover:to-green-700"
        >
          Continue to Game
        </button>
      </div>
    </div>
  );
}
