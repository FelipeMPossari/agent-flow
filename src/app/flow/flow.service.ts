import { Injectable } from '@angular/core';
import { Graph } from '@antv/x6';

@Injectable({
    providedIn: 'root'
})
export class FlowService {
    // Aqui guardaremos a instância viva do gráfico
    public graph!: Graph;
}