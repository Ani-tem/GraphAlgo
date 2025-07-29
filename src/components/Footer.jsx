import React from 'react';
import { Github, Linkedin } from 'lucide-react';
import { InstagramIcon } from './Icons';

const Footer = () => {
    return (
        <footer className="text-center py-4 mt-auto text-zinc-500 text-sm">
            <p>Made by Anirudh</p>
            <div className="flex items-center justify-center gap-4 mt-2">
                <a href="https://github.com/Ani-tem" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    <Github size={20} />
                </a>
                <a href="https://www.linkedin.com/in/anirudhvvbt/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    <Linkedin size={20} />
                </a>
                <a href="https://www.instagram.com/anirudh_tvvb/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    <InstagramIcon className="w-5 h-5" />
                </a>
            </div>
        </footer>
    );
};

export default Footer;
