/**
 * Copyright (c) 2023-present, Goldman Sachs
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {
  getDiagram,
  getPureGraph,
  type Entity,
  LegendStyleProvider,
} from '@finos/legend-vscode-extension-dependencies';
import { useRef, useState, useEffect } from 'react';
import {
  GET_PROJECT_ENTITIES,
  GET_PROJECT_ENTITIES_RESPONSE,
} from '../../utils/Const';
import { observer } from 'mobx-react-lite';
import { postMessage } from '../../utils/VsCodeUtils';

import type { DiagramEditorState } from '../../stores/DiagramEditorState';
import { DiagramEditorHeader } from './DiagramEditorHeader';
import { DiagramEditorToolPanel } from './DiagramEditorToolPanel';
import { DiagramEditorCanvas } from './DiagramEditorCanvas';

export const DiagramEditor = observer(
  ({ diagramEditorState }: { diagramEditorState: DiagramEditorState }) => {
    const diagramCanvasRef = useRef<HTMLDivElement>(null);
    const { diagramId } = diagramEditorState;
    const [entities, setEntities] = useState<Entity[]>([]);
    const [error, setError] = useState<string | null>();

    useEffect(() => {
      postMessage({
        command: GET_PROJECT_ENTITIES,
      });
    }, [diagramId]);

    window.addEventListener(
      'message',
      (event: MessageEvent<{ result: Entity[]; command: string }>) => {
        const message = event.data;
        if (message.command === GET_PROJECT_ENTITIES_RESPONSE) {
          const es: Entity[] = message.result;
          setEntities(es);
          diagramEditorState.setEntities(es);
        }
      },
    );

    useEffect(() => {
      if (entities.length && diagramId) {
        getPureGraph(entities, [])
          .then((pureModel) => {
            const diagram = getDiagram(diagramId, pureModel);
            diagramEditorState.setDiagram(diagram);
            diagramEditorState.setGraph(pureModel);
            setError(null);
          })
          .catch((e) => {
            setError(e.message);
          });
      }
    }, [entities, diagramId, diagramEditorState]);

    return (
      <LegendStyleProvider>
        <div className="diagram-editor">
          {error ? (
            <div className="diagram-editor__error">
              <span>Something went wrong. Diagram cannot be created.</span>
              <span
                className="diagram-editor__error__details"
                title={`${error}`}
              >
                Error Details.
              </span>
            </div>
          ) : (
            <>
              {diagramEditorState.isDiagramRendererInitialized && (
                <DiagramEditorHeader diagramEditorState={diagramEditorState} />
              )}
              <div className="diagram-editor__content">
                <div className="diagram-editor__stage">
                  {diagramEditorState.isDiagramRendererInitialized && (
                    <DiagramEditorToolPanel
                      diagramEditorState={diagramEditorState}
                    />
                  )}
                  <DiagramEditorCanvas
                    diagramEditorState={diagramEditorState}
                    ref={diagramCanvasRef}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </LegendStyleProvider>
    );
  },
);
