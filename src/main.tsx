import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { preloadVillageSprites } from './utils/imageTransparency';

// Açılışta tüm bina sprite'larını arka planda saydamlaştır ve önbelleğe al
preloadVillageSprites();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
