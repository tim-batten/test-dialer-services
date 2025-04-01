import { IsBoolean, IsEnum, IsOptional } from "class-validator";
import { UnreferencedKeyBehaviour } from "./db-config";

export class DbIntegrityCheckOptions {
  @IsBoolean()
  @IsOptional()
  enabled: boolean = true;

  @IsEnum(UnreferencedKeyBehaviour)
  @IsOptional()
  unreferencedKeyBehaviour = UnreferencedKeyBehaviour.NONE;
}
