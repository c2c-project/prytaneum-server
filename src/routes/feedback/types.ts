export type ReportQueryParams = {
    page: string;
    sortByDate: 'true' | 'false';
};

export type ReportQueryParamsAdmin = ReportQueryParams & {
    resolved: 'true' | 'false';
};

export type ReportParams = { reportId: string };
