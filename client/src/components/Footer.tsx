import React from 'react';
import '../styles/Footer.css';

// Import SVG icons directly as URLs
import BookIcon from '../assets/icons/IconoirBookmarkBook.svg';
import ChatCheckIcon from '../assets/icons/IconoirChatBubbleCheck.svg';
import GithubIcon from '../assets/icons/IconoirGithub.svg';
import MailIcon from '../assets/icons/IconoirMail.svg';

interface FooterLinkProps {
  href: string;
  iconSrc: string;
  text: string;
  ariaLabel: string;
}

const FooterLink: React.FC<FooterLinkProps> = React.memo(({ href, iconSrc, text, ariaLabel }) => (
  <a 
    href={href} 
    target="_blank" 
    rel="noopener noreferrer"
    aria-label={ariaLabel}
    className="footer-link"
  >
    <span className="footer-icon">
      <img src={iconSrc} alt="" aria-hidden="true" width="20" height="20" />
    </span>
    <span className="footer-text">{text}</span>
  </a>
));

const Footer: React.FC = React.memo(() => {
  return (
    <footer className="app-footer border rounded-lg">
      <div className="footer-container">
        <FooterLink 
          href="https://ai-seo-copilot.gitbook.io/ai-seo-copilot/" 
          iconSrc={BookIcon} 
          text="Documentation" 
          ariaLabel="View documentation"
        />
        <FooterLink 
          href="https://aiseocopilot.featurebase.app/" 
          iconSrc={ChatCheckIcon} 
          text="Feature requests" 
          ariaLabel="Submit feature requests"
        />
        <FooterLink 
          href="https://github.com/PMDevSolutions/seo-copilot/issues" 
          iconSrc={GithubIcon} 
          text="Report a bug" 
          ariaLabel="Report a bug on GitHub"
        />
        <FooterLink 
          href="mailto:sofianbettayeb@gmail.com" 
          iconSrc={MailIcon} 
          text="Contact us" 
          ariaLabel="Contact us via email"
        />
      </div>
    </footer>
  );
});

export default Footer;