// errors
const loadingError = (url)    => new Error(`Module ${url} loading too long. Maybe it's circular dependencies?`)
const parsingError = (url, e) => new Error(`Error while parsing module: ${url}, ${e}`)
