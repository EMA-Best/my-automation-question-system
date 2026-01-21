import { Controller, Get } from '@nestjs/common';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';

@Controller('admin')
export class AdminController {
  @Get('ping')
  @RequirePermissions('manage:admin')
  ping() {
    return {
      ok: true,
      t: Date.now(),
    };
  }
}
