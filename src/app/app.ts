import { Component } from '@angular/core';
// Deixe apenas o WorkflowDefinition aqui (remova o FlowTool)
import { WorkflowDefinition } from './flow/flow.models';
import { FlowEditorComponent } from './flow/flow-editor.component';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [FlowEditorComponent],
    templateUrl: './app.html', // ou o seu template inline
})
export class AppComponent {
    // APAGUE a variável: tools: FlowTool[] = [ ... ];

    public myControl = {
        // ... seus métodos do control continuam aqui
    };

    onSaveGraph(data: WorkflowDefinition) {
    }
}