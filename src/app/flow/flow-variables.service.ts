import { Injectable } from '@angular/core';
import { Graph } from '@antv/x6';

@Injectable({
  providedIn: 'root'
})
export class FlowVariablesService {
  private readonly BASE_SYSTEM_VARIABLES = ['sys_nome', 'sys_cpf', 'sys_telefone', 'sys_email'];

  public scanVariables(graph: Graph): string[] {
    if (!graph) {
      return [...this.BASE_SYSTEM_VARIABLES];
    }

    const variablesSet = new Set<string>(this.BASE_SYSTEM_VARIABLES);

    const nodes = graph.getNodes();
    nodes.forEach(node => {
      const data = node.getData();
      if (data && data.config) {
        if (data.config.waitForResponse === true && data.config.variableName) {
          variablesSet.add(data.config.variableName);
        }
      }
    });

    return Array.from(variablesSet);
  }
}
