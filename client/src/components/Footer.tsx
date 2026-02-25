import React from 'react';
import styled from 'styled-components';

// Import SVG icons directly as URLs
import BookIcon from '../assets/icons/IconoirBookmarkBook.svg';
import ChatCheckIcon from '../assets/icons/IconoirChatBubbleCheck.svg';
import GithubIcon from '../assets/icons/IconoirGithub.svg';
import MailIcon from '../assets/icons/IconoirMail.svg';

// Styled components replacing external CSS
const FooterContainer = styled.footer`
  width: 100%;
  margin-top: 0.5rem !important;
  margin-top: auto;
  position: sticky;
  bottom: 0;
  z-index: 10;
  border-radius: var(--radius-compact-footer);
  padding: var(--padding-compact-footer-y) var(--padding-compact-footer-x);
  height: var(--footer-height-compact);
  display: flex;
  align-items: center;
  /* Gradient border */
  border: 1px solid transparent;
  background:
    linear-gradient(var(--color-bg-700), var(--color-bg-700)) padding-box,
    linear-gradient(112deg, #717171 0%, #4C4A4A 100.39%) border-box;
`;

const LinksContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  flex-wrap: nowrap;
`;

const StyledLink = styled.a`
  display: flex;
  align-items: center;
  gap: 0.2rem;
  color: var(--color-primary);
  text-decoration: none;
  transition: all 0.2s ease;
  padding: 0.5rem;

  &:hover {
    color: var(--color-primary-dark, var(--color-primary));
    text-decoration: underline;
  }
`;

const IconWrapper = styled.span`
  display: flex;
  align-items: center;
  width: 1rem;
  height: 1rem;
  
  img {
    /* Invert dark icons to light and adjust brightness */
    filter: invert(1) brightness(1) saturate(0) opacity(0.9);
  }
`;

const TextWrapper = styled.span`
  font-size: var(--font-size-compact-xs);
`;

interface FooterLinkProps {
  href: string;
  iconSrc: string;
  text: string;
  ariaLabel: string;
}

const FooterLink: React.FC<FooterLinkProps> = React.memo(({ href, iconSrc, text, ariaLabel }) => (
  <StyledLink 
    href={href} 
    target="_blank" 
    rel="noopener noreferrer"
    aria-label={ariaLabel}
  >
    <IconWrapper>
      <img src={iconSrc} alt="" aria-hidden="true" width="20" height="20" />
    </IconWrapper>
    <TextWrapper>{text}</TextWrapper>
  </StyledLink>
));

const Footer: React.FC = React.memo(() => {
  return (
    <FooterContainer className="border rounded-lg">
      <LinksContainer>
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
      </LinksContainer>
    </FooterContainer>
  );
});

export default Footer;