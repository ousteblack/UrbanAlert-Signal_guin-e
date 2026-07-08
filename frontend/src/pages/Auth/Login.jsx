import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaMapMarkedAlt, FaEnvelope, FaLock, FaUser } from "react-icons/fa";
import { motion } from "framer-motion";
import Button from "../../components/ui/Button";
import { useTranslation, Trans } from "react-i18next";
import { login, register, forgotPassword, resetPassword, activateAccount } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";

export default function Login() {
  const { t } = useTranslation();
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(location.state?.isRegister ? false : true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const { login: setLoginContext } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.target);
    const password = formData.get("password");
    
    try {
      if (isLogin) {
        const identifier = formData.get("identifier");
        try {
          // Utilisation du nouvel endpoint de connexion avec identifier (email ou phone)
          const data = await login({ identifier, password });
          if (data?.token && data?.user) {
            setLoginContext(data.user, data.token);
            if (data.user.role === 'ADMIN') {
              navigate("/dashboard");
            } else {
              navigate("/report");
            }
          }
        } catch (error) {
          const isActivationRequired = error.response?.data?.requires_activation;
          if (isActivationRequired) {
            toast.warning(error.response?.data?.message);
            setIsActivating(true);
            setTimeout(() => {
              const el = document.getElementById("activate_identifier");
              if (el) el.value = identifier;
            }, 100);
          } else {
            const errorMsg = error.response?.data?.message || t('login.error_login');
            toast.error(errorMsg);
          }
        }
      } else {
        const fullname = formData.get("fullname");
        const email = formData.get("email");
        const phone = formData.get("phone");
        
        try {
          const res = await register({ fullname, email, phone, password });
          if (res.requires_activation) {
            toast.success(res.message);
            setIsActivating(true);
            setTimeout(() => {
              const el = document.getElementById("activate_identifier");
              if (el) el.value = email || phone;
            }, 100);
          } else {
            // Auto-login après inscription réussie sans email
            const data = await login({ identifier: email || phone, password });
            if (data?.token && data?.user) {
              setLoginContext(data.user, data.token);
              navigate("/report");
            }
          }
        } catch (error) {
          toast.error(error.response?.data?.message || t('login.error_register'));
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.target);
    const identifier = formData.get("identifier") || document.querySelector('input[name="identifier"]')?.value;
    const code = formData.get("code");
    const newPassword = formData.get("newPassword");

    try {
      if (resetStep === 1) {
        if (!identifier) {
          toast.error("Veuillez saisir votre email ou téléphone");
          setIsLoading(false);
          return;
        }
        const data = await forgotPassword(identifier);
        toast.success(data.message);
        if (data.code_pour_test) {
          toast.info("Code de test : " + data.code_pour_test, { autoClose: 10000 });
        }
        setResetStep(2);
      } else {
        const data = await resetPassword({ identifier, code, newPassword });
        toast.success(data.message);
        setIsForgotPassword(false);
        setResetStep(1);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivation = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.target);
    const identifier = formData.get("identifier");
    const code = formData.get("code");
    try {
      const data = await activateAccount({ identifier, code });
      toast.success(data.message);
      e.target.reset();
      setIsActivating(false);
      setIsLogin(true);
      setTimeout(() => {
        const el = document.getElementById("login_identifier");
        if (el) el.value = identifier;
      }, 100);
    } catch (error) {
      toast.error(error.response?.data?.message || "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background Image / Split layout */}
      <div className="absolute inset-0 z-0 hidden lg:block w-1/2">
        <div 
          className="w-full h-full bg-cover bg-center"
          style={{ backgroundImage: "url('/conakry-bg.jpg')" }}
        />
        <div className="absolute inset-0 bg-primary-dark/80 mix-blend-multiply" />
        
        <div className="absolute inset-0 flex flex-col justify-center px-16 text-white">
          <Link to="/" className="flex items-center gap-2 mb-12">
            <div className="bg-surface text-primary p-2 rounded-lg">
              <FaMapMarkedAlt className="text-2xl" />
            </div>
            <span className="text-3xl font-bold tracking-tight">
              Signal_<span className="text-accent">guinee</span>
            </span>
          </Link>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl font-bold mb-6 leading-tight"
          >
            <Trans i18nKey="login.hero_title">
              Rejoignez la <br/> communauté citoyenne.
            </Trans>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-primary-100 max-w-md"
          >
            {t('login.hero_subtitle')}
          </motion.p>
        </div>
      </div>

      {/* Form Container */}
      <div className="w-full lg:w-1/2 ml-auto flex items-center justify-center p-6 relative z-10">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md bg-surface p-8 sm:p-10 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="bg-primary text-white p-2 rounded-lg">
              <FaMapMarkedAlt className="text-xl" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-text-main">
              Signal_<span className="text-accent">guinee</span>
            </span>
          </div>

          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-text-main mb-2">
              {isActivating
                ? "Activer votre compte"
                : isForgotPassword 
                ? "Mot de passe oublié" 
                : isLogin ? t('login.title_welcome') : t('login.title_register')}
            </h2>
            <p className="text-text-muted">
              {isActivating
                ? "Entrez le code d'activation reçu par e-mail."
                : isForgotPassword 
                ? (resetStep === 1 ? "Entrez votre email ou numéro de téléphone pour recevoir un code." : "Entrez le code reçu et votre nouveau mot de passe.")
                : isLogin ? t('login.subtitle_welcome') : t('login.subtitle_register')}
            </p>
          </div>

          {isActivating ? (
            <form key="form-activation" onSubmit={handleActivation} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-text-main mb-1">Email ou Téléphone</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUser className="text-slate-400" />
                  </div>
                  <input 
                    type="text" 
                    name="identifier"
                    id="activate_identifier"
                    required 
                    placeholder="Votre adresse email ou numéro"
                    className="w-full pl-10 pr-4 py-3 bg-background border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-text-main"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-main mb-1">Code d'activation</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="text-slate-400" />
                  </div>
                  <input 
                    type="text" 
                    name="code"
                    required 
                    placeholder="Ex: 123456"
                    className="w-full pl-10 pr-4 py-3 bg-background border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-text-main text-center tracking-widest font-bold"
                  />
                </div>
              </div>
              <Button type="submit" variant="primary" fullWidth size="lg" loading={isLoading}>
                Activer mon compte
              </Button>
            </form>
          ) : !isForgotPassword ? (
            <form key={isLogin ? "form-login" : "form-register"} onSubmit={handleSubmit} className="space-y-6">
            {/* Registration Fields */}
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-text-main mb-1">{t('login.fullname_label')}</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaUser className="text-slate-400" />
                    </div>
                    <input 
                      type="text" 
                      name="fullname"
                      required 
                      placeholder={t('login.fullname_placeholder')}
                      className="w-full pl-10 pr-4 py-3 bg-background border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-text-main"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-main mb-1">{t('login.email_reg_label')}</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaEnvelope className="text-slate-400" />
                    </div>
                    <input 
                      type="email" 
                      name="email"
                      placeholder={t('login.email_reg_placeholder')}
                      className="w-full pl-10 pr-4 py-3 bg-background border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-text-main"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-main mb-1">{t('login.phone_label')}</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaUser className="text-slate-400" />
                    </div>
                    <input 
                      type="tel" 
                      name="phone"
                      placeholder={t('login.phone_placeholder')}
                      className="w-full pl-10 pr-4 py-3 bg-background border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-text-main"
                    />
                  </div>
                  <p className="text-xs text-text-muted mt-1">Fournissez au moins un e-mail ou un numéro de téléphone.</p>
                </div>
              </>
            )}

            {/* Login Only Field */}
            {isLogin && (
              <div>
                <label className="block text-sm font-medium text-text-main mb-1">{t('login.email_label')}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaEnvelope className="text-slate-400" />
                  </div>
                  <input 
                    type="text" 
                    name="identifier"
                    id="login_identifier"
                    required 
                    placeholder={t('login.email_placeholder')}
                    className="w-full pl-10 pr-4 py-3 bg-background border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-text-main"
                  />
                </div>
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-text-main">{t('login.password_label')}</label>
                {isLogin && <button type="button" onClick={() => setIsForgotPassword(true)} className="text-sm font-medium text-primary hover:text-primary-dark">{t('login.forgot_password')}</button>}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-slate-400" />
                </div>
                <input 
                  type="password" 
                  name="password"
                  required 
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-background border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-text-main"
                />
              </div>
            </div>

            <Button type="submit" variant="primary" fullWidth size="lg" loading={isLoading}>
              {isLogin ? t('login.btn_login') : t('login.btn_register')}
            </Button>
          </form>
          ) : (
            <form key="form-forgot-password" onSubmit={handleForgotPassword} className="space-y-6">
              {resetStep === 1 && (
                <div>
                  <label className="block text-sm font-medium text-text-main mb-1">Email ou Téléphone</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaUser className="text-slate-400" />
                    </div>
                    <input 
                      type="text" 
                      name="identifier"
                      id="reset_identifier"
                      required 
                      placeholder="Votre adresse email ou numéro"
                      className="w-full pl-10 pr-4 py-3 bg-background border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-text-main"
                    />
                  </div>
                </div>
              )}

              {resetStep === 2 && (
                <>
                  {/* Keep identifier hidden but submitted */}
                  <input type="hidden" name="identifier" value={document.getElementById('reset_identifier')?.value} />
                  <div>
                    <label className="block text-sm font-medium text-text-main mb-1">Code de confirmation</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaLock className="text-slate-400" />
                      </div>
                      <input 
                        type="text" 
                        name="code"
                        required 
                        placeholder="Ex: 123456"
                        className="w-full pl-10 pr-4 py-3 bg-background border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-text-main text-center tracking-widest font-bold"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-main mb-1">Nouveau mot de passe</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaLock className="text-slate-400" />
                      </div>
                      <input 
                        type="password" 
                        name="newPassword"
                        required 
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-3 bg-background border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-text-main"
                      />
                    </div>
                  </div>
                </>
              )}

              <Button type="submit" variant="primary" fullWidth size="lg" loading={isLoading}>
                {resetStep === 1 ? "Recevoir le code" : "Réinitialiser le mot de passe"}
              </Button>
            </form>
          )}

          <div className="mt-8 text-center text-sm text-text-muted">
            {isActivating ? (
              <button 
                onClick={() => { setIsActivating(false); setIsLogin(true); }}
                className="font-medium text-primary hover:text-primary-dark transition-colors"
              >
                Retour à la connexion
              </button>
            ) : !isForgotPassword ? (
              <div className="space-y-3">
                <div>
                  {isLogin ? t('login.no_account') : t('login.has_account')}
                  <button 
                    onClick={() => setIsLogin(!isLogin)}
                    className="font-medium text-primary hover:text-primary-dark transition-colors ml-1"
                  >
                    {isLogin ? t('login.title_register') : t('login.btn_login')}
                  </button>
                </div>
                {isLogin && (
                  <div>
                    Vous avez un code d'activation ? 
                    <button 
                      onClick={() => setIsActivating(true)}
                      className="font-medium text-primary hover:text-primary-dark transition-colors ml-1"
                    >
                      Activer mon compte
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={() => { setIsForgotPassword(false); setResetStep(1); }}
                className="font-medium text-primary hover:text-primary-dark transition-colors"
              >
                Retour à la connexion
              </button>
            )}
          </div>
          
          <div className="mt-6 text-center">
            <Link to="/" className="text-sm text-slate-400 hover:text-text-main transition-colors">
              {t('login.back_home')}
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
