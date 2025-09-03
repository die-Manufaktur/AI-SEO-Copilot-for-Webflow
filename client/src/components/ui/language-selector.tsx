import * as React from "react";
import { 
  SUPPORTED_LANGUAGES, 
  Language, 
  getDefaultLanguage 
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
    <div className={className}>
      <CopyTooltip content="Choose the language you want AI recommendations to appear in.">
        <Label htmlFor="language-select" className="text-sm font-medium cursor-help">
          {label}
        </Label>
      </CopyTooltip>
      <Select
        value={selectedLanguage.code}
        onValueChange={handleValueChange}
        disabled={disabled}
      >
        <SelectTrigger id="language-select" className="w-full mt-1 focus:ring-0 focus:ring-offset-0">
          <SelectValue>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{selectedLanguage.code}</span>
              <span>{selectedLanguage.nativeName}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-background border border-input shadow-md">
          {SUPPORTED_LANGUAGES.map((language) => (
            <SelectItem 
              key={language.code} 
              value={language.code}
              className="cursor-pointer focus:bg-accent focus:text-accent-foreground data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide w-8">{language.code}</span>
                <div className="flex flex-col">
                  <span>{language.nativeName}</span>
                  {language.name !== language.nativeName && (
                    <span className="text-xs text-muted-foreground">
                      {language.name}
                    </span>
                  )}
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}