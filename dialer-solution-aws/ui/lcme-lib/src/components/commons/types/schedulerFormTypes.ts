export interface FormSchedule {
    scheduleConfigName: string;
    timeZone:           string;
    doesEnd:            boolean;
    startDate:          string;
    startTime:          string;
    endTime:            string;
    endDate:            string;
    recurrence:         Recurrence;
    campaign:           string;
    scheduleLoops:      number;
    sequences:          Sequence[];
    isHoliday:          boolean;
    isEnabled:          boolean;
}

export interface Recurrence {
    type:  string;
    value: number;
    misc:  Misc;
}

export interface Misc {
    day: number[];
    dow: string;
}

export interface Sequence {
    sequenceName:        string;
    basicConfig:         BasicConfig;
    filteringAndSorting: FilteringAndSorting;
    pacing:              Pacing;
}

export interface BasicConfig {
    livePartyHandler:           string;
    livePartyContactFlow:        string;
    answeringMachineHandler:    string;
    answeringMachineContactFlow: string;
    phones:                     string[];
}

export interface FilteringAndSorting {
    contactFilters: ContactFilter[];
    phoneFilters:   ContactFilter[];
    contactSorting: ContactFilter[];
}

export interface ContactFilter {
    value: Value;
    label: Label;
}

export enum Label {
    Filter = "Filter",
    Filter2 = "Filter 2",
    Filter3 = "Filter 3",
}

export enum Value {
    JohnFilter1 = "{john:filter}:1",
    JohnFilter2 = "{john:filter}:2",
    JohnFilter3 = "{john:filter}:3",
}

export interface Pacing {
    clearPacing:     string;
    initialCpaMode:  string;
    initialCpa:      number;
    initialDuration: number;
    abaIncrement:    number;
    cpaModifier:     number;
    abaCalculation:  string;
    abaTargetRate:   number;
}
