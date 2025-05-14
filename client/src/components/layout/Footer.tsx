import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-primary-dark text-white py-4 sm:py-8">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-8 h-8 text-gold"
              >
                <path
                  d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 2V22M12 2L19 19.5M12 2L5 19.5M2 12H22M6 7H18M6 17H18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <h2 className="font-fantasy text-xl font-bold text-gold">Everdice</h2>
            </div>
            <p className="text-gray-300 mb-4">
              Your AI-powered companion for tabletop roleplaying adventures. Create characters, roll dice, and embark on epic quests.
            </p>
          </div>
          
          <div>
            <h3 className="font-fantasy text-lg font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link href="/"><a className="text-gray-300 hover:text-gold transition">Home</a></Link></li>
              <li><Link href="/characters"><a className="text-gray-300 hover:text-gold transition">Characters</a></Link></li>
              <li><Link href="/campaigns"><a className="text-gray-300 hover:text-gold transition">Campaigns</a></Link></li>
              <li><Link href="/dice-roller"><a className="text-gray-300 hover:text-gold transition">Dice Roller</a></Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-fantasy text-lg font-bold mb-4">Connect</h3>
            <div className="flex space-x-4 mb-4">
              <a href="#" className="text-gray-300 hover:text-gold transition text-xl">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                </svg>
              </a>
              <a href="#" className="text-gray-300 hover:text-gold transition text-xl">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15.2 8.8a3 3 0 1 0-5.4 1.8L8 17l6-6.8A2.9 2.9 0 0 0 15.2 8.8Z"></path>
                  <path d="M17.8 5.2a9 9 0 1 0-2 14.8L20 22l-2.2-2.2a9 9 0 0 0 0-14.6Z"></path>
                </svg>
              </a>
              <a href="#" className="text-gray-300 hover:text-gold transition text-xl">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <circle cx="12" cy="12" r="4"></circle>
                  <line x1="4.93" y1="4.93" x2="9.17" y2="9.17"></line>
                  <line x1="14.83" y1="14.83" x2="19.07" y2="19.07"></line>
                  <line x1="14.83" y1="9.17" x2="19.07" y2="4.93"></line>
                  <line x1="4.93" y1="19.07" x2="9.17" y2="14.83"></line>
                </svg>
              </a>
              <a href="#" className="text-gray-300 hover:text-gold transition text-xl">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                </svg>
              </a>
            </div>
            <p className="text-gray-400 text-sm">© 2023 Everdice. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
