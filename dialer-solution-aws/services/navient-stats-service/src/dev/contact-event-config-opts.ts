import { Type } from 'class-transformer';
import { IsInstance, IsInt, Validate, ValidateNested } from 'class-validator';

export type FinalCallStatus =
  | 'ABANDONED_IVR'
  | 'ABANDONED_QUEUE'
  | 'CONNECTED_AGENT'
  | 'NO_ANSWER'
  | 'BUSY'
  | 'MACHINE';

export class OutcomeWeights {
  @Type(() => Number)
  ABANDONED_IVR: number = 0.1;
  @Type(() => Number)
  ABANDONED_QUEUE: number = 0.1;
  @Type(() => Number)
  CONNECTED_AGENT: number = 0.5;
  @Type(() => Number)
  NO_ANSWER: number = 0.1;
  @Type(() => Number)
  BUSY: number = 0.1;
  @Type(() => Number)
  MACHINE: number = 0.1;
}

export class NumberMinMax {
  @IsInt()
  min!: number;
  @IsInt()
  max!: number;
}

export class ContactEventGeneratorOpts {
  @Type(() => OutcomeWeights)
  @IsInstance(OutcomeWeights)
  outcomes: OutcomeWeights = new OutcomeWeights();

  @IsInt()
  @IsInstance(NumberMinMax)
  ringTime: NumberMinMax = {
    min: 1000,
    max: 30000,
  };

  @Type(() => NumberMinMax)
  @IsInstance(NumberMinMax)
  connectedTime: NumberMinMax = {
    min: 1000,
    max: 30000,
  };
}

export class OutcomeThresholds {
  totalWeight: number;
  thresholdMap: Record<FinalCallStatus, number>;
  constructor(readonly weights: OutcomeWeights) {
    const { totalWeight, thresholds } = Object.entries(weights).reduce(
      (acc, [key, value]) => {
        acc.totalWeight += value;
        acc.thresholds[key] = acc.totalWeight;
        return acc;
      },
      { totalWeight: 0, thresholds: {} as Record<string, number> }
    );
    this.totalWeight = totalWeight;
    this.thresholdMap = thresholds;
  }

  getOutcome(): FinalCallStatus {
    const random = Math.random() * this.totalWeight;
    for (const [key, value] of Object.entries(this.thresholdMap)) {
      if (random < value) {
        return key as FinalCallStatus;
      }
    }
    return 'MACHINE';
  }
}