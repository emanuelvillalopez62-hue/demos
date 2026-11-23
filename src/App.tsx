import { useCallback, useEffect, useState } from 'react';
import { MotionConfig } from 'motion/react';
import { Language, PHARMACY_COPY } from './data/pharmacyData';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { ServicesSection } from './components/ServicesSection';
import { HealthTipsSection } from './components/HealthTipsSection';
import { PricingSection } from './components/PricingSection';
import { ScheduleLocationSection } from './components/ScheduleLocationSection';
import { FaqSection } from './components/FaqSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { ChatWidget } from './components/ChatWidget';

export default function App() {
  const [lang, setLang] = useState<Language>('es');
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMinimized, setChatMinimized] = useState(false);
  const [prefillPrompt, setPrefillPrompt] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = PHARMACY_COPY[lang].metaTitle;
  }, [lang]);

  const handleOpenVaccinationChat = useCallback(() => {
    setPrefillPrompt(
      lang === 'en'
        ? 'Hi Sofía, I would like to book an influenza vaccination appointment.'
        : 'Hola Sofía, quiero agendar una cita para vacunación contra la influenza.',
    );
    setChatOpen(true);
    setChatMinimized(false);
  }, [lang]);

  const handleAskSofia = useCallback((prompt: string) => {
    setPrefillPrompt(prompt);
    setChatOpen(true);
    setChatMinimized(false);
  }, []);

  const handleOpenChat = useCallback(() => {
    setChatOpen(true);
    setChatMinimized(false);
  }, []);

  const handleConsumePrefill = useCallback(() => {
    setPrefillPrompt(null);
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen flex flex-col bg-[var(--bg-canvas)] text-[var(--text-primary)]">
        <a href="#contenido-principal" className="skip-link">
          {PHARMACY_COPY[lang].skipToContent}
        </a>

        <Navbar
          lang={lang}
          onChangeLang={setLang}
          onBookVaccination={handleOpenVaccinationChat}
        />

        <main id="contenido-principal" className="flex-1">
          <HeroSection lang={lang} onBookVaccination={handleOpenVaccinationChat} />
          <ServicesSection lang={lang} onSelectVaccination={handleOpenVaccinationChat} />
          <HealthTipsSection lang={lang} onAskSofia={handleAskSofia} />
          <PricingSection lang={lang} onBookVaccination={handleOpenVaccinationChat} />
          <ScheduleLocationSection lang={lang} />
          <FaqSection lang={lang} />
          <ContactSection lang={lang} />
        </main>

        <Footer lang={lang} />

        <ChatWidget
          lang={lang}
          isOpen={chatOpen}
          isMinimized={chatMinimized}
          prefillPrompt={prefillPrompt}
          onOpen={handleOpenChat}
          onMinimize={() => setChatMinimized(true)}
          onClose={() => {
            setChatOpen(false);
            setChatMinimized(false);
          }}
          onConsumePrefill={handleConsumePrefill}
        />
      </div>
    </MotionConfig>
  );
}
