export type ReportQueryParams = {
    page: string;
    sortByDate?: 'true' | 'false' | '';
};

export type ReportQueryParamsAdmin = ReportQueryParams & {
    resolved: 'true' | 'false';
};

export type ReportParams = { reportId: string; townhallId: string };
export type ReportsResult<T> = { reports: T[]; count: number };
