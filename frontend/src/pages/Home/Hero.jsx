import { motion } from "framer-motion";
import { FaExclamationTriangle, FaArrowRight } from "react-icons/fa";
import Button from "../../components/ui/Button";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Hero() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  return (
    <section className="relative min-h-screen flex items-center pt-20 pb-16 overflow-hidden bg-slate-900">
      {/* Background with overlay */}
      <div 
        className="absolute inset-0 z-0 opacity-40 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')" }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-slate-900/80 via-slate-900/90 to-slate-900" />

      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <div className="max-w-3xl mx-auto text-center">


          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight"
          >
            {t("home.title")} <span className="text-gradient">{t("home.titleHighlight")}</span>
          </motion.h1>



          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            {(!user || user.role === 'CITIZEN') && (
              <Button variant="accent" size="lg" iconRight={<FaArrowRight />} onClick={() => navigate('/report')}>
                Signaler un incident
              </Button>
            )}
            {(!user || user.role === 'ADMIN') && (
              <Button variant="ghost" size="lg" className="text-white hover:bg-surface/10 border border-white/20" onClick={() => navigate('/map')}>
                Explorer la carte
              </Button>
            )}
          </motion.div>
        </div>
      </div>
      
      {/* Decorative blobs */}
      <div className="absolute top-1/4 left-0 w-72 h-72 bg-primary rounded-full mix-blend-multiply filter blur-[100px] opacity-50 animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-0 w-72 h-72 bg-accent rounded-full mix-blend-multiply filter blur-[100px] opacity-30 animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>
    </section>
  );
}
