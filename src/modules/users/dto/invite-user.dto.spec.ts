import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { InviteUserDto } from './invite-user.dto';

function build(overrides: Partial<InviteUserDto> = {}): InviteUserDto {
  return plainToInstance(InviteUserDto, {
    email: 'jane@example.com',
    name: 'Jane Doe',
    role_id: '2e6b1f2a-1c1a-4b2a-9c3a-2f0e2d3c4b5a',
    ...overrides,
  });
}

describe('InviteUserDto', () => {
  it('accepts a well-formed payload', async () => {
    const errors = await validate(build());
    expect(errors).toHaveLength(0);
  });

  it('rejects an empty name', async () => {
    const errors = await validate(build({ name: '' }));
    const nameError = errors.find(e => e.property === 'name');
    expect(nameError).toBeDefined();
    expect(nameError?.constraints).toHaveProperty('isNotEmpty');
  });

  it('rejects a missing name', async () => {
    const dto = build();
    delete (dto as { name?: string }).name;
    const errors = await validate(dto);
    const nameError = errors.find(e => e.property === 'name');
    expect(nameError).toBeDefined();
  });
});
