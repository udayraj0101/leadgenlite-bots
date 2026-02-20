from langchain_core.tools import tool
from datetime import datetime, timedelta


def get_pricing_service(plan: str) -> dict:
    """Service function containing business logic for pricing"""
    pricing = {
        "basic": {
            "price": 29,
            "billing": "monthly",
            "features": ["10 leads/day", "Email support", "Basic analytics"],
            "best_for": "Small businesses and startups"
        },
        "pro": {
            "price": 99,
            "billing": "monthly",
            "features": ["100 leads/day", "Priority support", "API access", "Advanced analytics", "Custom integrations"],
            "best_for": "Growing businesses"
        },
        "enterprise": {
            "price": 299,
            "billing": "monthly",
            "features": ["Unlimited leads", "24/7 support", "Custom integration", "Dedicated account manager", "SLA guarantee"],
            "best_for": "Large enterprises"
        }
    }
    return pricing.get(plan.lower(), {"error": "Plan not found. Available plans: basic, pro, enterprise"})


def get_features_service(plan: str = "all") -> dict:
    """Service function for feature information"""
    features = {
        "basic": {
            "lead_capture": "10 leads per day",
            "platforms": ["Web chat"],
            "analytics": "Basic dashboard",
            "support": "Email support (24h response)",
            "integrations": "None"
        },
        "pro": {
            "lead_capture": "100 leads per day",
            "platforms": ["Web chat", "Telegram", "WhatsApp"],
            "analytics": "Advanced analytics with exports",
            "support": "Priority email + chat support",
            "integrations": "Zapier, Webhooks, REST API"
        },
        "enterprise": {
            "lead_capture": "Unlimited",
            "platforms": ["All platforms + custom"],
            "analytics": "Full analytics suite + custom reports",
            "support": "24/7 phone + dedicated manager",
            "integrations": "All integrations + custom development"
        }
    }
    
    if plan.lower() == "all":
        return features
    return features.get(plan.lower(), {"error": "Plan not found"})


def schedule_demo_service(name: str, email: str, preferred_date: str = None) -> dict:
    """Service function for demo scheduling"""
    if not preferred_date:
        # Suggest next 3 available slots
        tomorrow = datetime.now() + timedelta(days=1)
        slots = [
            (tomorrow + timedelta(days=i)).strftime("%Y-%m-%d 10:00 AM")
            for i in range(3)
        ]
        return {
            "status": "pending",
            "message": f"Thank you {name}! Please choose a time slot.",
            "available_slots": slots,
            "next_step": "We'll send a calendar invite to {email}"
        }
    
    return {
        "status": "scheduled",
        "message": f"Demo scheduled for {preferred_date}",
        "attendee": name,
        "email": email,
        "calendar_invite": "sent",
        "meeting_link": "https://meet.leadgenlite.com/demo-xyz123"
    }


def calculate_roi_service(current_leads: int, conversion_rate: float, avg_deal_value: float) -> dict:
    """Service function for ROI calculation"""
    
    # Estimate improvement with LeadgenLite
    improved_leads = current_leads * 2.5  # 150% increase
    improved_conversion = conversion_rate * 1.3  # 30% improvement
    
    current_revenue = current_leads * (conversion_rate / 100) * avg_deal_value
    projected_revenue = improved_leads * (improved_conversion / 100) * avg_deal_value
    
    roi_increase = projected_revenue - current_revenue
    
    return {
        "current_monthly_leads": current_leads,
        "projected_monthly_leads": int(improved_leads),
        "current_monthly_revenue": f"${current_revenue:,.2f}",
        "projected_monthly_revenue": f"${projected_revenue:,.2f}",
        "estimated_roi_increase": f"${roi_increase:,.2f}",
        "payback_period": "2-3 months",
        "recommendation": "Pro plan" if improved_leads < 100 else "Enterprise plan"
    }


@tool
def get_pricing(plan: str) -> dict:
    """Get pricing information for a specific plan. Available plans: basic, pro, enterprise."""
    return get_pricing_service(plan)


@tool
def get_features(plan: str = "all") -> dict:
    """Get detailed features for a plan. Use 'all' to compare all plans."""
    return get_features_service(plan)


@tool
def schedule_demo(name: str, email: str, preferred_date: str = None) -> dict:
    """Schedule a product demo. If preferred_date is not provided, returns available slots."""
    return schedule_demo_service(name, email, preferred_date)


@tool
def calculate_roi(current_leads: int, conversion_rate: float, avg_deal_value: float) -> dict:
    """Calculate potential ROI with LeadgenLite. 
    Args:
        current_leads: Current monthly leads
        conversion_rate: Current conversion rate (percentage)
        avg_deal_value: Average deal value in dollars
    """
    return calculate_roi_service(current_leads, conversion_rate, avg_deal_value)


TOOLS = [get_pricing, get_features, schedule_demo, calculate_roi]
