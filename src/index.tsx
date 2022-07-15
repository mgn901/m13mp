import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import '@mgn901/m13tk2/css/style.css';

const root = createRoot(document.getElementById('app')!);
root.render(<App />);
