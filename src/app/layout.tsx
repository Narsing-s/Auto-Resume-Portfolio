import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata={title:'NARSING | MuleSoft & Integration',description:'Narsing Beesetti — MuleSoft Developer, Integration Specialist and Production Support.',metadataBase:new URL('https://github.com/Narsing-s/Auto-Resume-Portfolio')};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}