import * as React from "react";
import { 
  SUPPORTED_LANGUAGES, 
  Language, 
  getDefaultLanguage,
  detectSiteLanguage 
} from "../../../../shared/types/language";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { Label } from "./label";
import { CopyTooltip } from "./copy-tooltip";

interface LanguageSelectorProps {
  selectedLanguage: Language;
  onLanguageChange: (language: Language) => void;
  className?: string;
  disabled?: boolean;
  label?: string;
}

export function LanguageSelector({
  selectedLanguage,
  onLanguageChange,
  className,
  disabled = false,
  label = "Language"
}: LanguageSelectorProps) {
  // Get the detected site language code to show as default
  const detectedLanguageCode = React.useMemo(() => detectSiteLanguage(), []);

  const handleValueChange = (languageCode: string) => {
    const language = SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode);
    if (language) {
      onLanguageChange(language);
    } else {
      // Fallback to default language if something goes wrong
      onLanguageChange(getDefaultLanguage());
    }
  };

  return (
    <div className={className || 'flex flex-col gap-3'}>
      {label && (
        <CopyTooltip content="Choose the language you want AI recommendations to appear in.">
          <label htmlFor="language-select" className="text-[14px] font-semibold text-text1 block">
            {label}
          </label>
        </CopyTooltip>
      )}
      <Select
        value={selectedLanguage.code}
        onValueChange={handleValueChange}
        disabled={disabled}
      >
        <SelectTrigger id="language-select" className="focus:ring-0 focus:ring-offset-0 bg-[var(--color-bg-500)] text-text1 placeholder:text-text2 [&>span]:!text-[var(--color-text-primary)]">
          <SelectValue placeholder="Select a language" />
        </SelectTrigger>
        <SelectContent className="bg-background3 border border-divider shadow-md">
          {SUPPORTED_LANGUAGES.map((language) => {
            const isDetectedDefault = language.code === detectedLanguageCode;
            return (
              <SelectItem
                key={language.code}
                value={language.code}
                className="cursor-pointer focus:bg-background4 focus:text-text1 data-[highlighted]:bg-background4 data-[highlighted]:text-text1 hover:bg-background4 hover:text-text1 transition-colors"
              >
                {language.code.toUpperCase()} - {language.nativeName}{isDetectedDefault ? ' (default)' : ''}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}