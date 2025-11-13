export interface CurrentUserResponse {
  user: {
    id: string;
    name: string;
    retailerId?: string;
  };
}

