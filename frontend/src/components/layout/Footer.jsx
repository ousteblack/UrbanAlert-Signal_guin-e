import { Link } from "react-router-dom";
import { FaMapMarkedAlt, FaTwitter, FaFacebookF, FaInstagram } from "react-icons/fa";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();
  
  return (
    <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
      <div className="container mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="bg-primary text-white p-2 rounded-lg">
                <FaMapMarkedAlt className="text-xl" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-white">
                Signal_<span className="text-accent">guinee</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 mb-4">
              {t('footer.about_desc')}
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-primary transition-colors text-white">
                <FaTwitter />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-primary transition-colors text-white">
                <FaFacebookF />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-primary transition-colors text-white">
                <FaInstagram />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t('footer.quick_links')}</h3>
            <ul className="flex flex-col gap-2">
              <li><Link to="/map" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">{t('nav.map')}</Link></li>
              <li><Link to="/" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">{t('nav.stats')}</Link></li>
              <li><Link to="/report" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">{t('nav.reports')}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">{t('footer.legal')}</h3>
            <ul className="flex flex-col gap-2">
              <li><Link to="/terms" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">{t('footer.terms')}</Link></li>
              <li><Link to="/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">{t('footer.privacy')}</Link></li>
              <li><Link to="/cookies" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">{t('footer.cookies')}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Contact</h3>
            <p className="text-sm text-slate-400 mb-2">Quartier Almamya, Kaloum<br/>BP 1234 Conakry, Guinée</p>
            <p className="text-sm text-slate-400">contact@signal_guinee.gn<br/>+224 620 00 00 00</p>
          </div>
        </div>
        
        <div className="pt-8 border-t border-slate-800 text-center text-sm text-text-muted">
          &copy; {new Date().getFullYear()} Signal_guinee PRO. {t('footer.rights')}
        </div>
      </div>
    </footer>
  );
}
