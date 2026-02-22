import { mount } from 'svelte';
import App from './App.svelte';
import '../css/styles.css';
import '../css/tokens.css';

const app = mount(App, { target: document.getElementById('app')! });
export default app;
