export const scrollbarStyles = {
  home: `
  /* Landing oscuro + lima (home-bg #100b17 / home-lime #FFFF00) */
  html {
    scrollbar-width: thin;
    scrollbar-color: #FFFF00 #100b17;
  }
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  ::-webkit-scrollbar-track {
    background: #100b17;
    border-radius: 10px;
  }
  ::-webkit-scrollbar-thumb {
    background: #FFFF00;
    border-radius: 10px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #FFFFFF;
  }
`,
  brand: `
  /* Teal corporativo sobre quinto (tercero #00A49C / quinto #13112b) */
  html {
    scrollbar-width: thin;
    scrollbar-color: #00A49C #13112b;
  }
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  ::-webkit-scrollbar-track {
    background: #13112b;
    border-radius: 10px;
  }
  ::-webkit-scrollbar-thumb {
    background: #00A49C;
    border-radius: 10px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #FFFF00;
  }
`,
  violet: `
  /* Violeta sobre segundo (cuarto #6311A6 / segundo #0c0a1d) */
  html {
    scrollbar-width: thin;
    scrollbar-color: #6311A6 #0c0a1d;
  }
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  ::-webkit-scrollbar-track {
    background: #0c0a1d;
    border-radius: 10px;
  }
  ::-webkit-scrollbar-thumb {
    background: #6311A6;
    border-radius: 10px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #FFFF00;
  }
`,
};
