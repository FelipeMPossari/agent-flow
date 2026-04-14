import { createApplication } from '@angular/platform-browser';
import { createCustomElement } from '@angular/elements';
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { FlowEditorComponent } from './app/flow/flow-editor.component';

// Configuração básica da aplicação (providers, rotas se tivesse, etc)
const appConfig: ApplicationConfig = {
    providers: [
        provideZoneChangeDetection({ eventCoalescing: true })
    ]
};

(async () => {
    try {
        // 1. Cria a instância da aplicação (sem renderizar na tela ainda)
        const app = await createApplication(appConfig);

        // 2. Transforma o componente Angular em Web Component
        const el = createCustomElement(FlowEditorComponent, {
            injector: app.injector
        });

        // 3. Define o nome da tag HTML customizada
        // Vamos manter o nome que usamos na diretiva do AngularJS: 'agent-flow-element'
        if (!customElements.get('agent-flow-element')) {
            customElements.define('agent-flow-element', el);
        }

        console.log('[agent-flow] Web Component registrado com sucesso: agent-flow-element');
    } catch (err) {
        console.error('[agent-flow] Erro ao registrar Web Component:', err);
    }
})();