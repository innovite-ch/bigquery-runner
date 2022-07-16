import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import type {
  Data,
  RowsEvent,
  StartProcessingEvent,
  SuccessProcessingEvent,
  TableEvent,
} from "types";
import type { WebviewApi } from "vscode-webview";
import type { State } from "./App";
import App from "./App";
import tableEvent from "./tableEvent.json";

export const mockWebview = ({
  postMessage,
}: {
  postMessage: jest.Mock;
}): WebviewApi<State> => {
  let state: State | undefined;
  return {
    postMessage(message: unknown) {
      postMessage(message);
    },
    getState(): State | undefined {
      return state;
    },
    setState<T extends State | undefined>(newState: T): T {
      state = newState;
      return newState;
    },
  };
};

describe("App", () => {
  describe("with Rows", () => {
    it("should render null, boolean, number and string", async () => {
      const postMessage = jest.fn();
      const webview = mockWebview({ postMessage });

      render(<App webview={webview} />);
      window.postMessage(
        {
          source: "bigquery-runner",
          payload: {
            event: "startProcessing",
          },
        } as Data<StartProcessingEvent>,
        "*"
      );
      window.postMessage(
        JSON.stringify({
          source: "bigquery-runner",
          payload: {
            event: "rows",
            payload: {
              heads: [
                {
                  id: "column1",
                  name: "column1",
                  type: "STRING",
                  mode: "NULLABLE",
                },
                {
                  id: "column2",
                  name: "column2",
                  type: "BOOLEAN",
                  mode: "NULLABLE",
                },
                {
                  id: "column3",
                  name: "column3",
                  type: "FLOAT",
                  mode: "NULLABLE",
                },
                {
                  id: "column4",
                  name: "column4",
                  type: "STRING",
                  mode: "NULLABLE",
                },
              ],
              rows: [
                {
                  rowNumber: "234",
                  rows: [
                    [
                      { id: "column1", value: null },
                      { id: "column2", value: true },
                      { id: "column3", value: 3.14 },
                      { id: "column4", value: "foo" },
                    ],
                  ],
                },
              ],
              page: {
                hasPrev: false,
                hasNext: false,
                startRowNumber: "123",
                endRowNumber: "456",
                totalRows: "123000",
              },
            },
          },
        } as Data<RowsEvent>),
        "*"
      );
      window.postMessage(
        {
          source: "bigquery-runner",
          payload: {
            event: "successProcessing",
          },
        } as Data<SuccessProcessingEvent>,
        "*"
      );
      await waitFor(() => {
        expect(postMessage).toHaveBeenCalledTimes(1);
        expect(postMessage).toHaveBeenCalledWith({ event: "loaded" });

        expect(screen.getByText("column1")).toBeInTheDocument();
        expect(screen.getByText("column2")).toBeInTheDocument();
        expect(screen.getByText("column3")).toBeInTheDocument();
        expect(screen.getByText("column4")).toBeInTheDocument();
        expect(screen.getByText("234")).toBeInTheDocument();
        expect(screen.getByText("null")).toBeInTheDocument();
        expect(screen.getByText("true")).toBeInTheDocument();
        expect(screen.getByText("3.14")).toBeInTheDocument();
        expect(screen.getByText("foo")).toBeInTheDocument();
        expect(screen.getByText("123")).toBeInTheDocument();
        expect(screen.getByText("456")).toBeInTheDocument();
        expect(screen.getByText("123000")).toBeInTheDocument();

        const jsonl = screen.getByText("JSON Lines");
        expect(jsonl).toBeInTheDocument();
        fireEvent.click(jsonl);
        expect(postMessage).toHaveBeenCalledTimes(2);
        expect(postMessage).toHaveBeenCalledWith({
          event: "download",
          format: "jsonl",
        });

        const json = screen.getByText("JSON");
        expect(json).toBeInTheDocument();
        fireEvent.click(json);
        expect(postMessage).toHaveBeenCalledTimes(3);
        expect(postMessage).toHaveBeenCalledWith({
          event: "download",
          format: "json",
        });

        const csv = screen.getByText("CSV");
        expect(csv).toBeInTheDocument();
        fireEvent.click(csv);
        expect(postMessage).toHaveBeenCalledTimes(4);
        expect(postMessage).toHaveBeenCalledWith({
          event: "download",
          format: "csv",
        });

        const md = screen.getByText("Markdown");
        expect(md).toBeInTheDocument();
        fireEvent.click(md);
        expect(postMessage).toHaveBeenCalledTimes(5);
        expect(postMessage).toHaveBeenCalledWith({
          event: "download",
          format: "md",
        });

        const txt = screen.getByText("Plain Text");
        expect(txt).toBeInTheDocument();
        fireEvent.click(txt);
        expect(postMessage).toHaveBeenCalledTimes(6);
        expect(postMessage).toHaveBeenCalledWith({
          event: "download",
          format: "txt",
        });
      });
    });
  });

  describe("with Schema", () => {
    it("should render schema table", async () => {
      const postMessage = jest.fn();
      const webview = mockWebview({ postMessage });

      render(<App webview={webview} />);
      window.postMessage(
        {
          source: "bigquery-runner",
          payload: {
            event: "startProcessing",
          },
        } as Data<StartProcessingEvent>,
        "*"
      );
      window.postMessage(
        {
          source: "bigquery-runner",
          payload: tableEvent,
        } as Data<TableEvent>,
        "*"
      );
      window.postMessage(
        {
          source: "bigquery-runner",
          payload: {
            event: "successProcessing",
          },
        } as Data<SuccessProcessingEvent>,
        "*"
      );
      await waitFor(() => {
        expect(postMessage).toHaveBeenCalledTimes(1);
        expect(postMessage).toHaveBeenCalledWith({ event: "loaded" });

        expect(screen.getByText("Table ID")).toBeInTheDocument();
        expect(screen.getByText("Table size")).toBeInTheDocument();
        expect(screen.getByText("Long-term storage size")).toBeInTheDocument();
        expect(screen.getByText("Number of rows")).toBeInTheDocument();
        expect(screen.getByText("Created")).toBeInTheDocument();
        expect(screen.getByText("Last modified")).toBeInTheDocument();
        expect(screen.getByText("Table expiration")).toBeInTheDocument();
        expect(screen.getByText("Data location")).toBeInTheDocument();

        const schema = screen.getByLabelText("Schema");
        expect(schema).toBeInTheDocument();
        fireEvent.click(schema);

        expect(screen.getByText("en_label")).toBeInTheDocument();
        expect(screen.getByText("labels.language")).toBeInTheDocument();
        expect(screen.getByText("labels.value")).toBeInTheDocument();

        expect(screen.getByText("Type")).toBeInTheDocument();
        expect(screen.getAllByText("STRING")).toHaveLength(3);
        expect(screen.getByText("Mode")).toBeInTheDocument();
        expect(screen.getAllByText("NULLABLE")).toHaveLength(3);
      });
    });
  });
});
