import {ApplicationInsights} from "@microsoft/applicationinsights-web";
import { ReactPlugin } from "@microsoft/applicationinsights-react-js";

const defaultBrowserHistory = {
    url: "/",
    location: {pathname: ""},
    listen: () => {}
};
let browserHistory = defaultBrowserHistory;
if (typeof window !== 'undefined') {
    browserHistory = {...browserHistory, ...window.location};
    browserHistory.location.pathname = browserHistory?.state?.url;
}

const reactPlugin = new ReactPlugin();
const appInsights = new ApplicationInsights({
    config: {
        instrumentationKey: process.env.NEXT_PUBLIC_APP_INSIGHTS_INSTRUMENTATION_KEY,
        maxBatchSizeInBytes: 10000,
        maxBatchInterval: 20000,
        extensions: [reactPlugin],
        extensionConfig: {
            [reactPlugin.identifier]: {
                history: browserHistory
            }
        }
    }
});

if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_ENV === 'production') {
    appInsights.loadAppInsights();
}

export {appInsights, reactPlugin};