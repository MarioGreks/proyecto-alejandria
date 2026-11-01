import { Component } from 'react';
import type { ReactNode } from 'react';

/** Si un elemento decorativo del universo (p. ej. un rótulo de texto 3D) falla, se omite en vez de dejar el universo entero en blanco. */
export default class Seguro extends Component<{ children: ReactNode }, { fallo: boolean }> {
    state = { fallo: false };
    static getDerivedStateFromError() { return { fallo: true }; }
    componentDidCatch(error: unknown) { console.warn('Un elemento del universo falló y se omite:', error); }
    render() { return this.state.fallo ? null : this.props.children; }
}
