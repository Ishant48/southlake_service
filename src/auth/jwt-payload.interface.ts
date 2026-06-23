export interface JwtPayload {
  sub: number;
  email: string;
  username: string;
  isSuperAdmin: boolean;
}
