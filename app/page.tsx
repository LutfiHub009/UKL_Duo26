import { Button } from "@/components/ui/button";

export default function Home() { 
  return ( 
  <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black text-black dark:text-white transition-all duration-300">
    <div className="max-w-3xl text-center space-y-10">
      <h1 className="text-6xl font-semibold">Welcome to My Next.js App</h1>
      <p className="text-xl text-gray-600 dark:text-gray-400">This is a simple Next.js application.</p>
      <div className="space-x-3">
        <Button> button 1</Button>
        <Button> button 2</Button>
      </div>
    </div>
  </div>

  );
}