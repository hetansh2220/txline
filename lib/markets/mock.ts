import type { Market } from "./types";

// Sample markets for the UI. FixtureIds for the first three are real TxLINE
// devnet fixtures we've already pulled; the rest are illustrative. Kickoff
// times are absolute so rendering stays deterministic.
export const MOCK_MARKETS: Market[] = [
    {
        id: "ned-mar",
        fixtureId: 18172280,
        competition: "World Cup",
        home: "Netherlands",
        away: "Morocco",
        kickoff: 1784386800000,
        status: "open",
        bettors: 41,
        outcomes: [
            { key: "HOME", label: "Netherlands", pool: 1420 },
            { key: "DRAW", label: "Draw", pool: 760 },
            { key: "AWAY", label: "Morocco", pool: 690 },
        ],
    },
    {
        id: "usa-bih",
        fixtureId: 18172379,
        competition: "World Cup",
        home: "USA",
        away: "Bosnia & Herzegovina",
        kickoff: 1784950400000,
        status: "open",
        bettors: 27,
        outcomes: [
            { key: "HOME", label: "USA", pool: 980 },
            { key: "DRAW", label: "Draw", pool: 540 },
            { key: "AWAY", label: "Bosnia & Herzegovina", pool: 610 },
        ],
    },
    {
        id: "vie-mya",
        fixtureId: 18143850,
        competition: "Friendlies",
        home: "Vietnam",
        away: "Myanmar",
        kickoff: 1784300000000,
        status: "live",
        bettors: 18,
        outcomes: [
            { key: "HOME", label: "Vietnam", pool: 720 },
            { key: "DRAW", label: "Draw", pool: 300 },
            { key: "AWAY", label: "Myanmar", pool: 240 },
        ],
    },
    {
        id: "bra-arg",
        fixtureId: 18190001,
        competition: "World Cup",
        home: "Brazil",
        away: "Argentina",
        kickoff: 1785060000000,
        status: "open",
        bettors: 63,
        outcomes: [
            { key: "HOME", label: "Brazil", pool: 2100 },
            { key: "DRAW", label: "Draw", pool: 1180 },
            { key: "AWAY", label: "Argentina", pool: 1960 },
        ],
    },
    {
        id: "fra-ger",
        fixtureId: 18190002,
        competition: "World Cup",
        home: "France",
        away: "Germany",
        kickoff: 1785146400000,
        status: "open",
        bettors: 52,
        outcomes: [
            { key: "HOME", label: "France", pool: 1670 },
            { key: "DRAW", label: "Draw", pool: 940 },
            { key: "AWAY", label: "Germany", pool: 1510 },
        ],
    },
    {
        id: "esp-por",
        fixtureId: 18190003,
        competition: "World Cup",
        home: "Spain",
        away: "Portugal",
        kickoff: 1783900800000,
        status: "resolved",
        resolved: "HOME",
        bettors: 38,
        outcomes: [
            { key: "HOME", label: "Spain", pool: 1340 },
            { key: "DRAW", label: "Draw", pool: 620 },
            { key: "AWAY", label: "Portugal", pool: 880 },
        ],
    },
];
