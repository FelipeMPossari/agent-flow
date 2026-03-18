import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type ThemeType = 'light' | 'dark';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    private readonly theme = signal<ThemeType>('light');
    private readonly themeSubject = new BehaviorSubject<ThemeType>('light');
    public readonly theme$: Observable<ThemeType> = this.themeSubject.asObservable();

    constructor() {
        // Carrega o tema salvo do localStorage ou utiliza o padrão (light)
        const savedTheme = localStorage.getItem('app-theme') as ThemeType | null;
        if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
            this.theme.set(savedTheme);
            this.themeSubject.next(savedTheme);
        }
    }

    toggleTheme(): void {
        const newTheme = this.theme() === 'light' ? 'dark' : 'light';
        this.theme.set(newTheme);
        this.themeSubject.next(newTheme);
        localStorage.setItem('app-theme', newTheme);
    }

    setTheme(newTheme: ThemeType): void {
        this.theme.set(newTheme);
        this.themeSubject.next(newTheme);
        localStorage.setItem('app-theme', newTheme);
    }

    getTheme(): ThemeType {
        return this.theme();
    }

    isDarkTheme(): boolean {
        return this.theme() === 'dark';
    }

    isLightTheme(): boolean {
        return this.theme() === 'light';
    }
}
