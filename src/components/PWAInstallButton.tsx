import React, { useState } from 'react';
import { Download, Smartphone, CheckCircle, ExternalLink, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface Props {
  variant?: 'nav' | 'hero' | 'banner';
}

export const PWAInstallButton: React.FC<Props> = ({ variant = 'nav' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showManualGuide, setShowManualGuide] = useState(false);

  // If already installed, show small badge in settings, but hide intrusive button
  if (isInstalled) {
    if (variant === 'nav') return null;
    return (
      <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
        <CheckCircle className="w-4 h-4 text-emerald-600" />
        <span>Application installée (Mode Bureau / Autonome)</span>
      </div>
    );
  }

  return (
    <>
      {isInstallable ? (
        <button
          onClick={install}
          title="Installer l'application sur cet appareil (PC ou Mobile)"
          className={`flex items-center gap-2 rounded-lg font-medium transition cursor-pointer shadow-sm active:scale-95 ${
            variant === 'hero'
              ? 'bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 text-sm font-semibold shadow-blue-500/20'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-semibold'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>Installer l'application</span>
        </button>
      ) : isIOS ? (
        <button
          onClick={() => setShowIOSGuide(true)}
          title="Installer sur iPhone / iPad"
          className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition"
        >
          <Smartphone className="w-4 h-4 text-slate-600" />
          <span>Installer sur iOS</span>
        </button>
      ) : (
        <button
          onClick={() => setShowManualGuide(true)}
          title="Guide d'installation PC (.exe) & Mobile (PWA / APK)"
          className={`flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm transition ${
            variant === 'hero' ? 'px-4 py-2 text-sm font-medium' : 'px-2.5 py-1 text-xs'
          }`}
        >
          <Download className="w-3.5 h-3.5 text-blue-600" />
          <span>Installer PC / Mobile</span>
        </button>
      )}

      {/* iOS Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Installer sur iPhone & iPad</h3>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">1</span>
                <p>Dans Safari, appuyez sur l'icône de <strong>Partage</strong> en bas de l'écran (carré avec flèche vers le haut).</p>
              </div>
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">2</span>
                <p>Faites défiler la liste vers le bas et appuyez sur <strong>« Sur l'écran d'accueil »</strong>.</p>
              </div>
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">3</span>
                <p>Confirmez en cliquant sur <strong>« Ajouter »</strong> en haut à droite. L'application EduGest s'ouvrira comme une vraie application native sans barre d'adresse !</p>
              </div>
            </div>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition"
            >
              Compris
            </button>
          </div>
        </div>
      )}

      {/* Manual / Chrome Desktop Install Guide */}
      {showManualGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Installation EduGest (PC & Mobile)</h3>
              </div>
              <button
                onClick={() => setShowManualGuide(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4 space-y-4 text-sm text-slate-600">
              <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-xl">
                <p className="font-semibold text-blue-900 mb-1">💻 Sur PC Windows (Chrome / Edge / Brave) :</p>
                <p className="text-blue-800 text-xs leading-relaxed">
                  Cliquez sur l'icône d'ordinateur avec flèche située à l'extrême droite de la barre d'adresse de votre navigateur ou sur les <strong>trois points verticaux &gt; « Installer EduGest »</strong>. Une icône bureau et un raccourci Windows natif seront créés.
                </p>
              </div>
              <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl">
                <p className="font-semibold text-emerald-900 mb-1">📱 Sur Téléphone & Tablette Android :</p>
                <p className="text-emerald-800 text-xs leading-relaxed">
                  Ouvrez le menu Chrome (3 points en haut à droite) et touchez <strong>« Installer l'application »</strong> ou <strong>« Ajouter à l'écran d'accueil »</strong>.
                </p>
              </div>
              <div className="p-3.5 bg-amber-50 border border-amber-100 rounded-xl">
                <p className="font-semibold text-amber-900 mb-1">📦 Option .EXE Windows & Export Standalone :</p>
                <p className="text-amber-800 text-xs leading-relaxed">
                  Consultez l'onglet <strong>« Déploiement & .EXE »</strong> dans les paramètres pour télécharger l'archive portable Windows autonome et les scripts de compilation.
                </p>
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setShowManualGuide(false)}
                className="w-full rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
