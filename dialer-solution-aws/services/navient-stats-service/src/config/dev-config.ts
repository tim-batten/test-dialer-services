import { Type } from 'class-transformer';
import { IsBoolean, IsInstance, IsOptional } from 'class-validator';
import { ContactEventGeneratorOpts } from '../dev/contact-event-config-opts';

export class DevConfig {
  @IsBoolean()
  @IsOptional()
  skipFlowExecution = false;

  @Type(() => ContactEventGeneratorOpts)
  @IsInstance(ContactEventGeneratorOpts)
  contactEventGenerator: ContactEventGeneratorOpts = new ContactEventGeneratorOpts();
}