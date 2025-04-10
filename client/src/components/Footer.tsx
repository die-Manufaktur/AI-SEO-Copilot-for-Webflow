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
  background-color: var(--background2);
  border-top: 1px solid var(--color-border);
  margin-top: auto;
  position: sticky;
  bottom: 0;
  z-index: 10;
  border-radius: 0.5rem;
`;

const LinksContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: row;
  justify-content: space-evenly;
  flex-wrap: nowrap;
  gap: 0.5rem;
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
  font-size: 0.7rem;
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