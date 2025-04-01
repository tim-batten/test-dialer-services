import { plainToClass } from 'class-transformer';
import { IsInt, IsString, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { parseDuration } from 'lcme-common/lib/utils/duration-helper';
import { Units } from 'parse-duration';
import { InputUnit } from 'lcme-common/lib/utils/duration-helper';

export function TransformDuration(defaultInputUnit: InputUnit, outputUnit: Units) {
  return Transform(({ value }) => parseDuration(defaultInputUnit, outputUnit, value), { toClassOnly: true });
}

export class ClusterConfig {
  @IsString()
  serviceLabel!: string;

  @TransformDuration(InputUnit.SECOND, 'second')
  @IsInt()
  @Min(1)
  serviceTTL: number = 60;

  @TransformDuration(InputUnit.MILLISECOND, 'ms')
  @IsInt()
  @Min(1)
  serviceHeartbeatFrequency: number = 5000;

  @TransformDuration(InputUnit.MILLISECOND, 'ms')
  @IsInt()
  @Min(1)
  serviceStatusMonitorFrequency: number = 20000;

  static from(plain: object) {
    const clusterConf = plainToClass(ClusterConfig, plain);
    if (clusterConf.serviceHeartbeatFrequency >= clusterConf.serviceTTL * 1000) {
      throw `cluster.serviceHeartbeatFrequency (${clusterConf.serviceHeartbeatFrequency} milliseconds) must be less than cluster.serviceTTL (${clusterConf.serviceTTL} seconds)`;
    }
    return clusterConf;
  }
}
