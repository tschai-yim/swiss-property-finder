export class RequestLimitError extends Error {
    public partialResults?: any[];

    constructor(message: string, partialResults?: any[]) {
        super(message);
        this.name = 'RequestLimitError';
        this.partialResults = partialResults;
    }
}
