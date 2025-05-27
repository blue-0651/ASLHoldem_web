-- TournamentTicketDistribution 테이블 생성 SQL
-- 데이터베이스 연결이 복구된 후 수동으로 실행할 수 있습니다.

CREATE TABLE tournament_ticket_distributions (
    id BIGSERIAL PRIMARY KEY,
    tournament_id BIGINT NOT NULL,
    store_id BIGINT NOT NULL,
    allocated_quantity INTEGER NOT NULL CHECK (allocated_quantity > 0),
    remaining_quantity INTEGER NOT NULL CHECK (remaining_quantity >= 0),
    distributed_quantity INTEGER NOT NULL DEFAULT 0 CHECK (distributed_quantity >= 0),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    memo TEXT,
    
    -- 외래키 제약조건
    CONSTRAINT fk_tournament_ticket_distributions_tournament 
        FOREIGN KEY (tournament_id) REFERENCES tournaments_tournament(id) ON DELETE CASCADE,
    CONSTRAINT fk_tournament_ticket_distributions_store 
        FOREIGN KEY (store_id) REFERENCES stores_store(id) ON DELETE CASCADE,
    
    -- 유니크 제약조건 (한 토너먼트에 대해 한 매장은 하나의 분배 기록만)
    CONSTRAINT unique_tournament_store 
        UNIQUE (tournament_id, store_id),
    
    -- 체크 제약조건 (분배량 = 보유수량 + 배포수량)
    CONSTRAINT check_allocation_balance 
        CHECK (allocated_quantity = remaining_quantity + distributed_quantity)
);

-- 인덱스 생성
CREATE INDEX idx_tournament_ticket_distributions_tournament_id 
    ON tournament_ticket_distributions(tournament_id);
CREATE INDEX idx_tournament_ticket_distributions_store_id 
    ON tournament_ticket_distributions(store_id);
CREATE INDEX idx_tournament_ticket_distributions_created_at 
    ON tournament_ticket_distributions(created_at);

-- 테이블 코멘트
COMMENT ON TABLE tournament_ticket_distributions IS '본사에서 각 매장에 토너먼트 좌석권을 분배하는 정보를 관리하는 테이블';
COMMENT ON COLUMN tournament_ticket_distributions.tournament_id IS '토너먼트 ID';
COMMENT ON COLUMN tournament_ticket_distributions.store_id IS '매장 ID';
COMMENT ON COLUMN tournament_ticket_distributions.allocated_quantity IS '본사에서 매장에 분배한 좌석권 수량';
COMMENT ON COLUMN tournament_ticket_distributions.remaining_quantity IS '매장에서 현재 보유하고 있는 좌석권 수량';
COMMENT ON COLUMN tournament_ticket_distributions.distributed_quantity IS '매장에서 회원들에게 배포한 좌석권 수량';
COMMENT ON COLUMN tournament_ticket_distributions.created_at IS '분배 생성일자';
COMMENT ON COLUMN tournament_ticket_distributions.updated_at IS '수정일자';
COMMENT ON COLUMN tournament_ticket_distributions.memo IS '메모'; 