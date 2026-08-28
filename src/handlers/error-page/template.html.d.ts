// build.ts and bunfig.toml load ".html" with the text loader; bun's ambient
// types describe the default HTMLBundle loader instead.
declare const contents: string
export default contents
