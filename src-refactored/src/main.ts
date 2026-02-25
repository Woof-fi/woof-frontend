import { mount } from 'svelte';
import App from './App.svelte';
import '../css/global.css';
import '../css/styles.css';

const app = mount(App, { target: document.getElementById('app')! });
export default app;
