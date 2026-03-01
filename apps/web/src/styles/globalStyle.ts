import { createGlobalStyle } from "styled-components";

export const GlobalStyle = createGlobalStyle`
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  html, body, #root { height: 100%; }
  body {
    margin: 0;
    background: ${({ theme }) => theme.colors.bg};
    color: ${({ theme }) => theme.colors.text};
    font-family: ${({ theme }) => theme.font.body};
  }
  a { color: ${({ theme }) => theme.colors.accent}; text-decoration: none; }
  a:hover { text-decoration: underline; }
`;
