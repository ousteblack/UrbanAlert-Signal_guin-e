import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { useTranslation } from "react-i18next";

export default function PrivacyPolicy() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <div className="bg-surface rounded-2xl shadow-sm p-8 md:p-12 border border-slate-100 dark:border-slate-800">
          <h1 className="text-3xl md:text-4xl font-bold text-text-main mb-6">{t('legal.privacy_title')}</h1>
          <p className="text-text-muted mb-8 pb-8 border-b border-slate-100 dark:border-slate-800">
            {t('legal.last_updated')}
          </p>

          <div className="space-y-8 text-text-main leading-relaxed">
            <section>
              <h2 className="text-xl font-bold mb-4 text-primary">{t('legal.privacy_s1_title')}</h2>
              <p>
                {t('legal.privacy_s1_p')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4 text-primary">{t('legal.privacy_s2_title')}</h2>
              <p>
                {t('legal.privacy_s2_p')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4 text-primary">{t('legal.privacy_s3_title')}</h2>
              <p>
                {t('legal.privacy_s3_p')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4 text-primary">{t('legal.privacy_s4_title')}</h2>
              <p>
                {t('legal.privacy_s4_p')}
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
