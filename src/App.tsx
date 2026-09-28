import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './screens/Home';
import { Translate } from './screens/Translate';
import { Formula } from './screens/Formula';
import { Grid } from './screens/Grid';
import { Theory } from './screens/Theory';
import { AiLab } from './screens/AiLab';
import { Me } from './screens/Me';
import { getSettings, applyTheme } from './lib/settings';

export const App: React.FC = () => {
  useEffect(() => {
    const settings = getSettings();
    applyTheme(settings.theme);

    // If theme is 'system', listen for OS changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = () => {
      if (getSettings().theme === 'system') {
        applyTheme('system');
      }
    };
    mediaQuery.addEventListener('change', handleMediaChange);
    return () => mediaQuery.removeEventListener('change', handleMediaChange);
  }, []);

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="translate" element={<Translate />} />
          <Route path="formula" element={<Formula />} />
          <Route path="grid" element={<Grid />} />
          <Route path="theory" element={<Theory />} />
          <Route path="ai" element={<AiLab />} />
          <Route path="me" element={<Me />} />
          <Route path="settings" element={<Navigate to="/me" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
};
