from pydantic import BaseModel, Field, model_validator


class CategoryClickEvent(BaseModel):
    user_id: str = Field(..., min_length=1, description="Seeker / dashboard user id (users.id)")
    category_id: str = Field(..., min_length=1, description="product_categories.id")


class FunctionalityClickEvent(BaseModel):
    user_id: str = Field(..., min_length=1, description="Seeker user id (users.id)")
    functionality_id: int = Field(..., ge=1, description="expert_functionality_options.id")


class ProfileViewEvent(BaseModel):
    user_id: str = Field(..., min_length=1, description="Viewer user id")
    expert_id: str = Field(..., min_length=1, description="Expert user id (users.id)")


class ExpertBookedEvent(BaseModel):
    user_id: str = Field(..., min_length=1, description="Seeker user id")
    expert_id: str = Field(..., min_length=1, description="Expert user id (bookings.expert_id)")


class ExpertCategoryMap(BaseModel):
    expert_user_id: str
    category_id: str


class EventResponse(BaseModel):
    recorded: bool
    is_new: bool
    reason: str | None = None


class CategoryStats(BaseModel):
    category_id: str
    unique_clickers_mysql: int
    unique_clickers_redis: int | None = None


class RankedExpert(BaseModel):
    position: int
    expert_id: str
    display_name: str
    rank_score: float
    components: dict


class SearchQueryEvent(BaseModel):
    user_id: str = Field(..., min_length=1)
    query_text: str | None = None
    problem_statement: str | None = None
    keywords: list[str] | None = None

    @model_validator(mode="after")
    def at_least_one_field(self):
        has_kw = self.keywords and len(self.keywords) > 0
        if not (self.query_text or self.problem_statement or has_kw):
            raise ValueError("Provide query_text, problem_statement, and/or non-empty keywords")
        return self


class UserBehaviorSummary(BaseModel):
    user_id: str
    unique_experts_viewed: int
    unique_experts_booked: int
    view_to_book_conversion_rate: float
    search_queries_recorded: int
    distinct_categories_clicked: int


class SeekerConversionRollup(BaseModel):
    user_id: str
    unique_experts_viewed: int
    unique_experts_booked: int
    conversion_rate: float
    updated_at: str | None = None


class FunctionalityViewsSummaryRow(BaseModel):
    functionality_id: int
    total_profile_views: int
